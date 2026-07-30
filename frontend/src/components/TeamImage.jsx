import React, { useState } from 'react'
import { Shield } from 'lucide-react'
import { getTeamImageUrl } from '../services/teamApi'

const TeamImage = ({ team, className, fallbackClassName = '', alt }) => {
    const [imageFailed, setImageFailed] = useState(false)
    const imageUrl = getTeamImageUrl(team)
    const teamName = team?.name ?? 'Unknown team'

    if (!imageUrl || imageFailed) {
        return (
            <span
                aria-label={`${teamName} badge unavailable`}
                role="img"
                className={`inline-grid shrink-0 place-items-center ${className} ${fallbackClassName}`}
            >
                <Shield className="size-1/2" aria-hidden="true" />
            </span>
        )
    }

    return (
        <img
            src={imageUrl}
            alt={alt ?? `${teamName} flag or crest`}
            onError={() => setImageFailed(true)}
            className={className}
            loading="lazy"
        />
    )
}

export default TeamImage